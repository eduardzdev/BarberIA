import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { useAuth } from '@/hooks/useAuth';
import { getRedirectResult } from 'firebase/auth';
import { auth } from '@/firebase';

/**
 * LoginPage Component
 * 
 * Tela de autenticação com suporte a:
 * - Login com email/senha
 * - Cadastro de nova conta
 * - Login com Google OAuth
 * - Acesso público sem login (para BookingPage)
 * 
 * Integração:
 * - useAuth hook (Firebase Auth + Zod validation)
 * - AuthStore (Zustand) - gerenciado pelo hook
 * 
 * Referência: ANALISE_COMPLETA_UI.md - Seção 1 (Login/Auth)
 * Estados: ESTADOS_ESPECIAIS.md - Seção Autenticação
 */
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    login, 
    loginWithGoogle, 
    register, 
    loading, 
    error: authError
  } = useAuth();

  // UI State
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState('');
  const [isVerifyingRedirect, setIsVerifyingRedirect] = useState(true);

  // Check for Google OAuth redirect result on mount
  useEffect(() => {
    const verifyRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User successfully signed in, will redirect via App.tsx
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

  // Clear local error when switching tabs
  useEffect(() => {
    setLocalError('');
    setPassword('');
    setConfirmPassword('');
    setName('');
  }, [activeTab]);

  /**
   * Handle Login or Register action
   */
  const handleAuthAction = async () => {
    setLocalError('');

    // Validation
    if (!email || !password) {
      setLocalError('Por favor, preencha email e senha.');
      return;
    }

    if (activeTab === 'register') {
      if (!name) {
        setLocalError('Por favor, preencha seu nome.');
        return;
      }
      if (!confirmPassword) {
        setLocalError('Por favor, confirme sua senha.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('As senhas não coincidem.');
        return;
      }
      if (password.length < 6) {
        setLocalError('A senha deve ter no mínimo 6 caracteres.');
        return;
      }
    }

    try {
      if (activeTab === 'login') {
        await login({ email, password });
        // Success: App.tsx will redirect to /dashboard
      } else {
        await register({ 
          name, 
          email, 
          password, 
          confirmPassword,
          phone: '' // opcional
        });
        // Success: App.tsx will redirect to /dashboard
      }
    } catch (err) {
      // Error handled by useAuth and displayed via authError
      console.error('Auth action error:', err);
    }
  };

  /**
   * Handle Google OAuth Sign In
   */
  const handleGoogleSignIn = async () => {
    setLocalError('');
    try {
      await loginWithGoogle();
      // Redirects to Google, will return via getRedirectResult
    } catch (err) {
      console.error('Google sign in error:', err);
    }
  };

  /**
   * Handle Continue Without Login (Public Booking)
   */
  const handleContinueWithoutLogin = () => {
    navigate('/booking');
  };

  /**
   * Handle Enter key press
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleAuthAction();
    }
  };

  // Display error (from useAuth or local validation)
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
      <Card className="w-full max-w-sm">
        {/* Logo and Title */}
        <div className="flex flex-col items-center text-center p-4">
          <div className="w-16 h-16 bg-violet-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
            <Icon name="scissors" className="w-8 h-8 text-slate-950" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">BarberIA</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Acesso ao Painel Profissional ou Tela de Agendamentos para Clientes
          </p>
        </div>

        {/* Tabs: Login / Cadastro */}
        <div className="px-4">
          <div className="flex border-b border-slate-700 mb-6">
            <button
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 text-center font-semibold transition-colors duration-300 ${
                activeTab === 'login'
                  ? 'text-violet-400 border-b-2 border-violet-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
              type="button"
            >
              Login
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-2 text-center font-semibold transition-colors duration-300 ${
                activeTab === 'register'
                  ? 'text-violet-400 border-b-2 border-violet-400'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
              type="button"
            >
              Cadastro
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="px-4 pb-6 space-y-4">
          {/* Name Field (Register only) */}
          {activeTab === 'register' && (
            <div>
              <label 
                className="text-sm font-medium text-slate-400" 
                htmlFor="name"
              >
                Nome Completo
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Seu nome"
                disabled={loading}
                className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
            </div>
          )}

          {/* Email Field */}
          <div>
            <label 
              className="text-sm font-medium text-slate-400" 
              htmlFor="email"
            >
              Email
            </label>
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

          {/* Password Field */}
          <div>
            <label 
              className="text-sm font-medium text-slate-400" 
              htmlFor="password"
            >
              Senha
            </label>
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

          {/* Confirm Password Field (Register only) */}
          {activeTab === 'register' && (
            <div>
              <label 
                className="text-sm font-medium text-slate-400" 
                htmlFor="confirmPassword"
              >
                Confirmar Senha
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="••••••"
                disabled={loading}
                className="mt-1 w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
            </div>
          )}

          {/* Error Message */}
          {displayError && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start space-x-2">
              <Icon name="alert" className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{displayError}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleAuthAction}
            disabled={loading}
            className="w-full bg-violet-600 text-white font-bold py-3 rounded-lg hover:bg-violet-700 transition-colors duration-300 shadow-lg shadow-violet-600/20 disabled:bg-slate-500 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center space-x-2"
          >
            {loading && (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>
              {loading 
                ? 'Aguarde...' 
                : activeTab === 'login' 
                  ? 'Entrar' 
                  : 'Cadastrar'
              }
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center space-x-2">
            <div className="flex-grow h-px bg-slate-700"></div>
            <span className="text-slate-500 text-sm font-medium">ou</span>
            <div className="flex-grow h-px bg-slate-700"></div>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-slate-100 text-slate-800 font-bold py-3 rounded-lg hover:bg-slate-200 transition-colors duration-300 flex items-center justify-center space-x-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            <Icon name="google" className="w-5 h-5" />
            <span>Continuar com Google</span>
          </button>

          {/* Continue Without Login Button */}
          <button
            type="button"
            onClick={handleContinueWithoutLogin}
            className="w-full bg-transparent border-2 border-slate-600 text-slate-300 font-bold py-3 rounded-lg hover:bg-slate-800 hover:border-slate-500 transition-colors duration-300"
          >
            Continuar sem login
          </button>
        </div>
      </Card>
    </div>
  );
};
