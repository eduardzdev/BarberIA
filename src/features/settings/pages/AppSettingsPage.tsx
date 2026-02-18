/**
 * AppSettingsPage - Página de configurações do aplicativo
 * 
 * Página para configurações gerais do app:
 * - Tema (claro/escuro) - atualmente apenas escuro disponível
 * - Informações da conta (email, senha)
 * - Notificações (novos agendamentos, lembretes)
 * - Links diversos (privacidade, suporte, novidades)
 * 
 * Integração:
 * - Firebase Auth para email/senha
 * - UIStore para preferências
 * - NotificationsStore para configurações de notificações
 * 
 * Referências:
 * - ANALISE_COMPLETA_UI.md - Seção 12 (Configurações do App)
 * - DESCRICAO_FEATURES.md - Seção 11 (Configurações)
 * 
 * Features:
 * - Seletor de tema (UI apenas - dark mode fixo)
 * - Informações da conta
 * - Toggle de notificações
 * - Links de ajuda e suporte
 */

import React, { useState } from 'react';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Modal } from '@/components/Modal';
import { useAuthStore } from '@/store/auth.store';
import { useUI } from '@/hooks/useUI';
import { auth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { PrivacyPolicyModal } from '../components/PrivacyPolicyModal';
import { useAuth } from '@/hooks/useAuth';

// ===== Sub-Components =====

/**
 * SettingsItem - Item de configuração reutilizável
 */
interface SettingsItemProps {
  icon: string;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  variant?: 'default' | 'danger';
}

const SettingsItem: React.FC<SettingsItemProps> = ({ icon, label, sublabel, onClick, children, variant = 'default' }) => {
  const textColor = variant === 'danger' ? 'text-red-400' : 'text-slate-200';
  const iconColor = variant === 'danger' ? 'text-red-400' : 'text-slate-400';

  const content = (
    <div className="flex items-center justify-between w-full py-4 px-4 transition-all">
      <div className="flex items-center space-x-4">
        <Icon name={icon} className={`w-6 h-6 ${iconColor}`} />
        <div>
          <p className={`font-semibold ${textColor}`}>{label}</p>
          {sublabel && <p className="text-sm text-slate-500">{sublabel}</p>}
        </div>
      </div>
      <div>{children ? children : onClick && <Icon name="right" className="w-5 h-5 text-slate-500" />}</div>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left hover:bg-slate-700/40 transition-all rounded-xl">
        {content}
      </button>
    );
  }
  return <div className="w-full">{content}</div>;
};

/**
 * ToggleSwitch - Switch toggle reutilizável
 */
interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange }) => (
  <button
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none ${enabled ? 'bg-violet-600' : 'bg-slate-600'
      }`}
  >
    <span
      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
    />
  </button>
);

// ===== Main Component =====

export const AppSettingsPage: React.FC = () => {
  // Hooks
  const { user } = useAuthStore();
  const { deleteAccount, deactivateAccount } = useAuth();
  const { success, error: showError, openModal, closeModal, isModalOpen } = useUI();

  // State
  const [theme, setTheme] = useState('dark'); // Only dark theme available for now
  const [notifications, setNotifications] = useState({
    newAppointments: true,
    reminders: true
  });
  const [loadingAction, setLoadingAction] = useState(false);

  // Handlers
  const handleResetPassword = async () => {
    if (!user?.email) {
      showError('Email não encontrado');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, user.email);
      success('Email de redefinição enviado com sucesso! Confira sua caixa de entrada.');
    } catch (err) {
      showError('Erro ao enviar email de redefinição');
    }
  };

  const handleNotificationToggle = (key: 'newAppointments' | 'reminders', enabled: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: enabled }));
    // TODO: Save to Firestore or local storage
  };

  const handleOpenSupport = () => {
    window.open('https://wa.me/5511999999999?text=Olá, preciso de ajuda com o BarberIA', '_blank');
  };

  const handleOpenPrivacy = () => {
    openModal('privacyPolicy');
  };

  const handleOpenWhatsNew = () => {
    openModal('whatsNew');
  };

  // Danger Zone Handlers
  const confirmDeactivate = async () => {
    setLoadingAction(true);
    try {
      await deactivateAccount();
      // Não precisa de success msg pois faz logout/reload
    } catch (err) {
      console.error(err);
      // Erro já tratado no hook useAuth (showError)
    } finally {
      setLoadingAction(false);
      closeModal('confirmDeactivate');
    }
  };

  const confirmDelete = async () => {
    setLoadingAction(true);
    try {
      await deleteAccount();
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        showError('Por segurança, faça login novamente antes de excluir sua conta.');
        setTimeout(() => {
          auth.signOut();
          window.location.reload();
        }, 3000);
      } else {
        console.error(err);
      }
    } finally {
      setLoadingAction(false);
      closeModal('confirmDelete');
    }
  };

  return (
    <>
      <div className="space-y-6 pb-6">
        {/* Appearance Section */}
        <Card>
          <h2 className="font-bold text-slate-100 text-lg mb-2 px-4 pt-2">Aparência</h2>
          <SettingsItem icon="palette" label="Tema do App">
            <div className="flex p-1 bg-slate-700 rounded-lg">
              <button
                onClick={() => setTheme('light')}
                disabled
                className={`px-4 py-1 text-sm font-semibold rounded ${theme === 'light' ? 'bg-slate-500 text-white' : 'text-slate-400 opacity-50 cursor-not-allowed'
                  }`}
              >
                Claro
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-4 py-1 text-sm font-semibold rounded ${theme === 'dark' ? 'bg-violet-600 text-white' : 'text-slate-400'
                  }`}
              >
                Escuro
              </button>
            </div>
          </SettingsItem>
          <p className="text-xs text-slate-500 mt-2 px-3">
            Tema claro em breve! Enquanto isso, aproveite o visual escuro.
          </p>
        </Card>

        {/* Account Section */}
        <Card>
          <h2 className="font-bold text-slate-100 text-lg mb-2 px-4 pt-2">Conta</h2>
          <div className="divide-y divide-slate-700/50">
            <SettingsItem icon="user" label="Email" sublabel={user?.email || 'Não autenticado'} />
            <SettingsItem icon="key" label="Redefinir Senha" onClick={handleResetPassword} />
          </div>
        </Card>

        {/* Notifications Section */}
        <Card>
          <h2 className="font-bold text-slate-100 text-lg mb-2 px-4 pt-2">Notificações</h2>
          <div className="divide-y divide-slate-700/50">
            <SettingsItem icon="calendar" label="Novos Agendamentos" sublabel="Notificações push">
              <ToggleSwitch
                enabled={notifications.newAppointments}
                onChange={(enabled) => handleNotificationToggle('newAppointments', enabled)}
              />
            </SettingsItem>
            <SettingsItem icon="bell" label="Lembretes de Agendamento" sublabel="1h antes do horário">
              <ToggleSwitch
                enabled={notifications.reminders}
                onChange={(enabled) => handleNotificationToggle('reminders', enabled)}
              />
            </SettingsItem>
          </div>
        </Card>

        {/* More Section */}
        <Card>
          <h2 className="font-bold text-slate-100 text-lg mb-2 px-4 pt-2">Mais</h2>
          <div className="divide-y divide-slate-700/50">
            <SettingsItem icon="shield" label="Dados e Privacidade" onClick={handleOpenPrivacy} />
            <SettingsItem icon="help" label="Suporte" sublabel="Fale conosco via WhatsApp" onClick={handleOpenSupport} />
            <SettingsItem icon="gift" label="Novidades do App" onClick={handleOpenWhatsNew} />
          </div>
        </Card>

        {/* Danger Zone */}
        <div className="border border-red-900/50 rounded-2xl bg-red-950/10 overflow-hidden shadow-lg shadow-red-900/5">
          <div className="p-5 border-b border-red-900/30 bg-red-900/20">
            <h2 className="font-bold text-red-400 text-lg flex items-center gap-2">
              <Icon name="alert" className="w-5 h-5" />
              Zona de Perigo
            </h2>
          </div>
          <div className="divide-y divide-red-900/30">
            <SettingsItem
              icon="eyeOff"
              label="Desativar Conta"
              sublabel="Seus dados serão mantidos por 30 dias"
              variant="danger"
              onClick={() => openModal('confirmDeactivate')}
            />
            <SettingsItem
              icon="trash"
              label="Excluir Conta Permanentemente"
              sublabel="Ação irreversível. Todos os dados serão apagados."
              variant="danger"
              onClick={() => openModal('confirmDelete')}
            />
          </div>
        </div>

        {/* App Info */}
        <div className="text-center py-4">
          <p className="text-slate-500 text-xs">BarberIA v1.0.0</p>
          <p className="text-slate-600 text-xs mt-1">Desenvolvido por WebMind AI.</p>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isModalOpen('whatsNew')}
        onClose={() => closeModal('whatsNew')}
        title="Novidades do App 🎉"
      >
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-slate-100 mb-2">Versão 1.0.0</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start">
                <span className="text-violet-400 mr-2">•</span>
                <span>Sistema completo de agendamentos com 3 visualizações (Timeline, Kanban, Calendar)</span>
              </li>
              <li className="flex items-start">
                <span className="text-violet-400 mr-2">•</span>
                <span>Gestão de clientes com histórico e avaliações</span>
              </li>
              <li className="flex items-start">
                <span className="text-violet-400 mr-2">•</span>
                <span>Controle financeiro com relatórios mensais/semanais/diários</span>
              </li>
              <li className="flex items-start">
                <span className="text-violet-400 mr-2">•</span>
                <span>Catálogo de serviços personalizável</span>
              </li>
              <li className="flex items-start">
                <span className="text-violet-400 mr-2">•</span>
                <span>Dashboard com visão geral do negócio</span>
              </li>
              <li className="flex items-start">
                <span className="text-violet-400 mr-2">•</span>
                <span>Integração com Firebase para dados em tempo real</span>
              </li>
            </ul>
          </div>
          <div className="pt-4">
            <h3 className="font-bold text-slate-100 mb-2">Em breve 🚀</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start">
                <span className="text-yellow-400 mr-2">•</span>
                <span>Tema claro</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-400 mr-2">•</span>
                <span>Notificações push</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-400 mr-2">•</span>
                <span>Relatórios em PDF</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-400 mr-2">•</span>
                <span>Integração com calendário do Google</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => closeModal('whatsNew')}
            className="w-full bg-violet-600 text-white font-bold py-2 rounded-lg hover:bg-violet-700 mt-4"
          >
            Entendi!
          </button>
        </div>
      </Modal>

      <PrivacyPolicyModal
        isOpen={isModalOpen('privacyPolicy')}
        onClose={() => closeModal('privacyPolicy')}
      />

      {/* Confirmation Modals for Danger Zone */}
      <Modal
        isOpen={isModalOpen('confirmDeactivate')}
        onClose={() => closeModal('confirmDeactivate')}
        title="Desativar Conta"
      >
        <div className="space-y-4">
          <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-lg">
            <p className="text-yellow-200 font-medium flex items-center gap-2">
              <Icon name="warning" className="w-5 h-5" />
              Atenção
            </p>
            <p className="text-sm text-yellow-100/80 mt-1">
              Sua conta ficará invisível e inacessível. Seus dados serão mantidos por 30 dias caso queira reativar. Após esse período, serão excluídos permanentemente.
            </p>
          </div>
          <p className="text-slate-300">
            Deseja continuar com a desativação?
          </p>
          <div className="flex space-x-3 pt-2">
            <button
              onClick={() => closeModal('confirmDeactivate')}
              className="flex-1 bg-slate-700 text-slate-200 font-bold py-2 rounded-lg hover:bg-slate-600"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDeactivate}
              disabled={loadingAction}
              className="flex-1 bg-yellow-600 text-white font-bold py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
            >
              {loadingAction ? 'Processando...' : 'Desativar Conta'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isModalOpen('confirmDelete')}
        onClose={() => closeModal('confirmDelete')}
        title="Excluir Conta Permanentemente"
      >
        <div className="space-y-4">
          <div className="bg-red-900/20 border border-red-700/50 p-4 rounded-lg">
            <p className="text-red-200 font-medium flex items-center gap-2">
              <Icon name="trash" className="w-5 h-5" />
              Ação Irreversível
            </p>
            <p className="text-sm text-red-100/80 mt-1">
              Todos os seus dados (clientes, agendamentos, configurações) serão apagados IMEDIATAMENTE. Esta ação não pode ser desfeita.
            </p>
          </div>
          <p className="text-slate-300">
            Tem certeza absoluta que deseja excluir sua conta?
          </p>
          <div className="flex space-x-3 pt-2">
            <button
              onClick={() => closeModal('confirmDelete')}
              className="flex-1 bg-slate-700 text-slate-200 font-bold py-2 rounded-lg hover:bg-slate-600"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              disabled={loadingAction}
              className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loadingAction ? 'Excluindo...' : 'Sim, Excluir Tudo'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
