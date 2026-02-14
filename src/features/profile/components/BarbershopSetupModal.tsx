/**
 * BarbershopSetupModal - Modal de configuração inicial GAMIFICADO
 * 
 * Wizard em 3 etapas com UX otimizada:
 * 1. Identidade - Nome e WhatsApp (essencial)
 * 2. Localização - Endereço completo
 * 3. Redes Sociais - Opcional (bônus)
 * 
 * Features:
 * - Barra de progresso animada
 * - Ícones elegantes (sem emojis)
 * - Celebração ao completar
 * - Skip opcional para redes sociais
 */

import React, { useState, useEffect } from 'react';
import { Icon } from '@/components/Icon';
import { useBarbershop } from '@/hooks/useBarbershop';

interface BarbershopSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  phone: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  instagram?: string;
  facebook?: string;
  website?: string;
}

// Constantes para steps
const STEPS = [
  {
    id: 1,
    title: 'Identidade',
    icon: 'scissors',
    description: 'Como os clientes vão encontrar você?'
  },
  {
    id: 2,
    title: 'Localização',
    icon: 'mapPin',
    description: 'Onde sua barbearia está localizada?'
  },
  {
    id: 3,
    title: 'Redes Sociais',
    icon: 'globe',
    description: 'Conecte seu público! (Opcional)'
  },
];

export const BarbershopSetupModal: React.FC<BarbershopSetupModalProps> = ({ isOpen, onClose }) => {
  const { updateShopInfo } = useBarbershop();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showCelebration, setShowCelebration] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    address: '',
    neighborhood: '',
    city: '',
    state: '',
    instagram: '',
    facebook: '',
    website: '',
  });

  // Validações por step
  const isStep1Valid = formData.name.trim().length >= 3 && formData.phone.length >= 14;
  const isStep2Valid = formData.address.trim() && formData.neighborhood.trim() &&
    formData.city.trim() && formData.state.trim().length === 2;

  // Navegação entre steps
  const goToNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Formatar telefone automaticamente
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  // Pular onboarding (marcar como completo sem preencher)
  const handleSkipOnboarding = async () => {
    setLoading(true);
    try {
      // Marca onboarding como completo para não aparecer novamente
      await updateShopInfo({ onboardingCompleted: true });
      onClose();
    } catch (error) {
      console.error('Erro ao pular onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  // Salvar dados
  const handleSave = async () => {
    setLoading(true);
    try {
      const fullAddress = `${formData.address}, ${formData.neighborhood}`;

      // Constrói objeto apenas com campos preenchidos (Firestore não aceita undefined)
      const shopData: Record<string, string | boolean> = {
        name: formData.name,
        phone: formData.phone,
        address: fullAddress,
        city: formData.city,
        state: formData.state,
        onboardingCompleted: true,
      };

      // Adiciona redes sociais apenas se preenchidas
      if (formData.instagram?.trim()) shopData.instagram = formData.instagram.trim();
      if (formData.facebook?.trim()) shopData.facebook = formData.facebook.trim();
      if (formData.website?.trim()) shopData.website = formData.website.trim();

      await updateShopInfo(shopData);

      // Mostrar celebração
      setShowCelebration(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Erro ao salvar dados da barbearia:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset ao abrir
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setShowCelebration(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Tela de celebração
  if (showCelebration) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2">
        <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm mx-2 p-8 text-center border border-violet-500/30">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Icon name="check" className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Parabéns!</h2>
          <p className="text-slate-400 mb-4">
            Sua barbearia está configurada e pronta para receber clientes!
          </p>
          <div className="flex items-center justify-center gap-2 text-violet-400">
            <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
            <span className="text-sm">Redirecionando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm mx-2 overflow-hidden border border-slate-800">

        {/* Header com progresso */}
        <div className="bg-gradient-to-r from-violet-600/10 to-purple-600/10 p-5 border-b border-slate-800">
          {/* Progress bar - Corrigido alinhamento */}
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                {/* Step circle */}
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0
                  ${currentStep > step.id
                    ? 'bg-green-500 text-white'
                    : currentStep === step.id
                      ? 'bg-violet-500 text-white ring-2 ring-violet-400/50 ring-offset-2 ring-offset-slate-900'
                      : 'bg-slate-800 text-slate-500'}
                `}>
                  {currentStep > step.id ? (
                    <Icon name="check" className="w-5 h-5" />
                  ) : (
                    <Icon name={step.icon} className="w-5 h-5" />
                  )}
                </div>

                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded transition-all duration-300 ${currentStep > step.id ? 'bg-green-500' : 'bg-slate-700'
                    }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step info */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Icon name={STEPS[currentStep - 1].icon} className="w-5 h-5 text-violet-400" />
              <h2 className="text-lg font-bold text-white">
                {STEPS[currentStep - 1].title}
              </h2>
            </div>
            <p className="text-sm text-slate-400">
              {STEPS[currentStep - 1].description}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">

          {/* STEP 1: Identidade */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Nome da Barbearia */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Icon name="store" className="w-4 h-4 text-violet-400" />
                  Nome da Barbearia
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Barbearia do João"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all mt-2"
                  autoFocus
                />
                {formData.name && formData.name.length >= 3 && (
                  <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                    <Icon name="check" className="w-3 h-3" /> Ótimo nome!
                  </p>
                )}
              </div>

              {/* WhatsApp */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Icon name="whatsapp" className="w-4 h-4 text-green-400" />
                  WhatsApp para contato
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    phone: formatPhone(e.target.value)
                  }))}
                  placeholder="(11) 99999-8888"
                  maxLength={15}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all mt-2"
                />
                {formData.phone.length >= 14 && (
                  <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                    <Icon name="check" className="w-3 h-3" /> Número válido!
                  </p>
                )}
              </div>

              {/* Dica */}
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 flex items-start gap-3">
                <Icon name="info" className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                <p className="text-violet-300 text-sm">
                  O WhatsApp será usado para os clientes confirmarem agendamentos.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: Localização */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Endereço */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Icon name="home" className="w-4 h-4 text-violet-400" />
                  Endereço (Rua e Número)
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Rua das Flores, 123"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all mt-2"
                  autoFocus
                />
              </div>

              {/* Bairro */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Icon name="buildings" className="w-4 h-4 text-violet-400" />
                  Bairro
                </label>
                <input
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  placeholder="Centro"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all mt-2"
                />
              </div>

              {/* Cidade e Estado - CORRIGIDO ALINHAMENTO */}
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3">
                  <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                    <Icon name="location" className="w-4 h-4 text-violet-400" />
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="São Paulo"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all mt-2"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    UF
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                    placeholder="SP"
                    maxLength={2}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all uppercase text-center mt-2"
                  />
                </div>
              </div>

              {isStep2Valid && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-start gap-3">
                  <Icon name="mapPin" className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-green-300 text-sm">
                    Endereço completo! Seus clientes poderão te encontrar facilmente.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Redes Sociais */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 flex items-start gap-3 mb-4">
                <Icon name="star" className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-purple-300 text-sm">
                  Etapa bônus! Conecte suas redes para mais visibilidade.
                </p>
              </div>

              {/* Instagram */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Icon name="instagram" className="w-4 h-4 text-pink-500" />
                  Instagram
                </label>
                <input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                  placeholder="@suabarbearia"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all mt-2"
                  autoFocus
                />
              </div>

              {/* Facebook */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Icon name="facebook" className="w-4 h-4 text-blue-500" />
                  Facebook
                </label>
                <input
                  type="text"
                  value={formData.facebook}
                  onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                  placeholder="facebook.com/suabarbearia"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mt-2"
                />
              </div>

              {/* Website */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Icon name="globe" className="w-4 h-4 text-green-500" />
                  Site ou TikTok
                </label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://seusite.com"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all mt-2"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer com navegação */}
        <div className="bg-slate-900/50 border-t border-slate-800 p-4">
          <div className="flex gap-3">
            {/* Botão Voltar / Pular */}
            {currentStep === 1 ? (
              <button
                onClick={handleSkipOnboarding}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-400 font-medium hover:bg-slate-800 hover:text-slate-300 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Salvando...' : 'Configurar depois'}
              </button>
            ) : (
              <button
                onClick={goToPrevStep}
                className="px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-300 font-medium hover:bg-slate-800 transition-all flex items-center gap-2 text-sm"
              >
                <Icon name="left" className="w-4 h-4" />
                Voltar
              </button>
            )}

            {/* Botão Avançar / Finalizar */}
            {currentStep < 3 ? (
              <button
                onClick={goToNextStep}
                disabled={(currentStep === 1 && !isStep1Valid) || (currentStep === 2 && !isStep2Valid)}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm ${(currentStep === 1 && isStep1Valid) || (currentStep === 2 && isStep2Valid)
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-500/20'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
              >
                Continuar
                <Icon name="right" className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-xl font-medium transition-all bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Icon name="rocket" className="w-4 h-4" />
                    Finalizar
                  </>
                )}
              </button>
            )}
          </div>

          {/* Skip para step 3 - sempre disponível pois redes sociais são opcionais */}
          {currentStep === 3 && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full mt-3 px-4 py-2 text-slate-500 text-xs hover:text-slate-400 transition-colors"
            >
              Pular e finalizar sem redes sociais
            </button>
          )}
        </div>
      </div>

      {/* CSS para animação */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
};
